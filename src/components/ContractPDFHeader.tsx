
interface ContractPDFHeaderProps {
  contractNumber: string;
}

const ContractPDFHeader = ({ contractNumber }: ContractPDFHeaderProps) => {
  return (
    <div className="mb-8">
      {/* Top section with company name and contact info */}
      <div className="flex justify-between items-start mb-6">
        {/* Company name on left */}
        <div className="flex-1">
          <div className="text-2xl font-bold tracking-wider">
            BONATOURS
          </div>
          <div className="text-lg tracking-wide mt-1">
            LOCATION DE VOITURES
          </div>
        </div>
        
        {/* Contact info on right */}
        <div className="text-sm text-right leading-relaxed">
          <div>10 Avenue des Far, 3ème Étage - Bureau N° 308 - Casablanca - Maroc</div>
          <div>Tél: 0522228704 - Fax: 05 22 47 17 80</div>
          <div>GSM: 06 62 59 63 07</div>
          <div>E-mail: bonatours308@gmail.com</div>
        </div>
      </div>
      
      {/* Middle section - centered */}
      <div className="text-center mb-4">
        <div className="text-lg font-semibold mb-2">
          Courte et longue durée 7/7
        </div>
      </div>
      
      {/* Contract title and number section */}
      <div className="flex items-center justify-center relative mb-6">
        <div className="border-2 border-black px-8 py-2">
          <span className="text-xl font-bold tracking-wider">
            CONTRAT DE LOCATION
          </span>
        </div>
        <div className="absolute right-0 text-lg font-bold">
          N° : {contractNumber}
        </div>
      </div>
    </div>
  );
};

export default ContractPDFHeader;
