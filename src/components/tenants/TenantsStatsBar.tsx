
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface Props {
  tenantsLength: number;
  mainTenants: number;
  nationalityCount: number;
  foreignTenantCount: number;
}

export default function TenantsStatsBar({ tenantsLength, mainTenants, nationalityCount, foreignTenantCount }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{tenantsLength}</p>
            <p className="text-sm text-gray-600">Total Locataires</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{mainTenants}</p>
            <p className="text-sm text-gray-600">Locataires Principaux</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {nationalityCount}
            </p>
            <p className="text-sm text-gray-600">Nationalités</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {foreignTenantCount}
            </p>
            <p className="text-sm text-gray-600">Étrangers</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
