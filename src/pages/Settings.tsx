import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  Save, 
  RefreshCw, 
  Trash2, 
  FileDown, 
  Settings as SettingsIcon,
  Clock,
  AlertTriangle
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { localStorageService } from '@/services/localStorageService';
import { useSettings } from '@/hooks/useSettings';

type AutoBackupFrequency = 'disabled' | 'daily' | 'weekly' | 'monthly';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';

const Settings = () => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { generatePDF } = usePDFGeneration();
  const { 
    autoBackupFrequency, 
    setAutoBackupFrequency, 
    lastBackupDate,
    performBackup,
    performRestore,
    clearAllData 
  } = useSettings();

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    // Simuler une vérification de mise à jour
    setTimeout(() => {
      setIsChecking(false);
      toast({
        title: "✅ Application à jour",
        description: "Votre application est déjà à jour (v1.0.0)",
      });
    }, 2000);
  };

  const handleExportAllContracts = async () => {
    setIsExporting(true);
    try {
      const contracts = localStorageService.getAll('contracts');
      
      if (contracts.length === 0) {
        toast({
          title: "Aucun contrat",
          description: "Il n'y a aucun contrat à exporter",
          variant: "destructive"
        });
        setIsExporting(false);
        return;
      }

      // Créer un PDF avec tous les contrats
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Tous les Contrats - Export</title>
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
            .contract { page-break-after: always; padding: 20px; border: 1px solid #ddd; margin-bottom: 20px; }
            .contract:last-child { page-break-after: avoid; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .title { font-size: 18px; font-weight: bold; color: #333; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .status { padding: 4px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
            .status-ouvert { background: #e7f3ff; color: #0066cc; }
            .status-ferme { background: #f0f9f0; color: #008000; }
            .status-signed { background: #e8f5e8; color: #2d5a2d; }
          </style>
        </head>
        <body>
          ${contracts.map((contract: any, index: number) => `
            <div class="contract">
              <div class="header">
                <div class="title">CONTRAT DE LOCATION N° ${contract.contract_number}</div>
                <div style="margin-top: 10px; color: #666;">Contrat ${index + 1} sur ${contracts.length}</div>
              </div>
              
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="label">Client :</span>
                    <span class="value">${contract.customer_name}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Téléphone :</span>
                    <span class="value">${contract.customer_phone || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Email :</span>
                    <span class="value">${contract.customer_email || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">CIN :</span>
                    <span class="value">${contract.customer_national_id || 'N/A'}</span>
                  </div>
                </div>
                
                <div>
                  <div class="info-item">
                    <span class="label">Véhicule :</span>
                    <span class="value">${contract.vehicle}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Date début :</span>
                    <span class="value">${new Date(contract.start_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Date fin :</span>
                    <span class="value">${new Date(contract.end_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  ${contract.prolongationAu ? `
                    <div class="info-item">
                      <span class="label">Prolongé jusqu'au :</span>
                      <span class="value">${new Date(contract.prolongationAu).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="label">Tarif journalier :</span>
                    <span class="value">${contract.daily_rate} DH</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Montant total :</span>
                    <span class="value">${contract.total_amount} DH</span>
                  </div>
                </div>
                
                <div>
                  <div class="info-item">
                    <span class="label">Statut :</span>
                    <span class="status status-${contract.status}">${contract.status}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Créé le :</span>
                    <span class="value">${new Date(contract.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              
              ${contract.notes ? `
                <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                  <div class="label">Notes :</div>
                  <div class="value">${contract.notes}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        
        toast({
          title: "✅ Export réussi",
          description: `${contracts.length} contrats exportés en PDF`,
        });
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "❌ Erreur d'export",
        description: "Impossible d'exporter les contrats",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupData = async () => {
    setIsBackingUp(true);
    try {
      await performBackup();
      toast({
        title: "✅ Sauvegarde réussie",
        description: "Toutes les données ont été sauvegardées",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur de sauvegarde",
        description: "Impossible de sauvegarder les données",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await performRestore(text);
      
      if (success) {
        toast({
          title: "✅ Restauration réussie",
          description: "Les données ont été restaurées avec succès",
        });
        // Recharger la page pour refléter les nouvelles données
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('Fichier invalide');
      }
    } catch (error) {
      toast({
        title: "❌ Erreur de restauration",
        description: "Le fichier de sauvegarde est invalide",
        variant: "destructive"
      });
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData();
      toast({
        title: "✅ Données supprimées",
        description: "Toutes les données ont été supprimées",
      });
      // Recharger la page pour refléter les changements
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de supprimer les données",
        variant: "destructive"
      });
    }
  };

  const handleClearLocalStorage = () => {
    try {
      localStorage.clear();
      toast({
        title: "✅ LocalStorage vidé",
        description: "Le localStorage du navigateur a été complètement vidé",
      });
      // Recharger la page pour refléter les changements
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de vider le localStorage",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vérification de mise à jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Mise à jour
            </CardTitle>
            <CardDescription>
              Vérifiez et téléchargez les dernières mises à jour
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Version actuelle: v1.0.0</span>
              <Badge variant="secondary">Stable</Badge>
            </div>
            <Button 
              onClick={handleCheckUpdate} 
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Vérifier la mise à jour
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export PDF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Export des contrats
            </CardTitle>
            <CardDescription>
              Exportez tous les contrats en un seul fichier PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleExportAllContracts} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter tous les contrats
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sauvegarde des données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Sauvegarde des données
            </CardTitle>
            <CardDescription>
              Sauvegardez et restaurez vos données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastBackupDate && (
              <div className="text-sm text-muted-foreground">
                Dernière sauvegarde: {new Date(lastBackupDate).toLocaleString('fr-FR')}
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={handleBackupData} 
                disabled={isBackingUp}
                className="w-full"
              >
                {isBackingUp ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder toutes les données
                  </>
                )}
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Restaurer une sauvegarde
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Sauvegarde automatique</span>
              </div>
              <Select value={autoBackupFrequency} onValueChange={(value: string) => setAutoBackupFrequency(value as AutoBackupFrequency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Désactivée</SelectItem>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Suppression des données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zone dangereuse
            </CardTitle>
            <CardDescription>
              Actions irréversibles sur vos données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Effacer toutes les données
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Confirmer la suppression
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>Êtes-vous sûr de vouloir supprimer toutes les données ?</strong>
                    <br /><br />
                    Cette action supprimera définitivement :
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Tous les contrats</li>
                      <li>Tous les clients</li>
                      <li>Tous les véhicules</li>
                      <li>Toutes les factures</li>
                      <li>Toutes les réparations</li>
                      <li>Toutes les dépenses</li>
                    </ul>
                    <br />
                    <strong>Cette action est irréversible.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearAllData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Oui, supprimer toutes les données
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Vider le LocalStorage
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Vider le LocalStorage ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>Cette action videra complètement le localStorage du navigateur.</strong>
                    <br /><br />
                    Cela supprimera :
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Toutes les données de l'application</li>
                      <li>Tous les paramètres et préférences</li>
                      <li>Toutes les sauvegardes automatiques</li>
                    </ul>
                    <br />
                    <strong>Utilisez cette option si vous rencontrez des problèmes de stockage.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearLocalStorage}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Oui, vider le localStorage
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;