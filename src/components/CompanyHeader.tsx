
import { useState, useEffect } from "react";
import { useContract } from "@/context/ContractContext";

interface CompanyProfileData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
}

const CompanyHeader = () => {
  const { contractData } = useContract();
  const { companyData, contractors } = contractData;
  const [profileData, setProfileData] = useState<CompanyProfileData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: ""
  });

  useEffect(() => {
    // Carregar dados do perfil da empresa salvos no localStorage
    const savedProfile = localStorage.getItem("companyProfile");
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfileData({
        name: parsedProfile.name || "",
        address: parsedProfile.address || "",
        phone: parsedProfile.phone || "",
        email: parsedProfile.email || "",
        website: parsedProfile.website || "",
        logo: parsedProfile.logo || ""
      });
    }
  }, []);

  // PRIORIZAR dados do contrato (companyData) se disponíveis, senão usar localStorage
  const displayData = {
    name: companyData?.name || profileData.name || "Empresa não informada",
    address: companyData?.address || profileData.address || "Endereço não informado",
    phone: companyData?.phone || profileData.phone || "Telefone não informado",
    email: companyData?.email || profileData.email || "Email não informado",
    website: companyData?.website || profileData.website || "",
    logo: companyData?.logo || profileData.logo || "",
    cnpj: companyData?.cnpj || "CNPJ não informado",
    city: companyData?.city || "Cidade não informada",
    state: companyData?.state || "Estado não informado",
    responsibleName: companyData?.responsibleName || "Responsável não informado"
  };

  console.log("🏢 CompanyHeader - Dados da empresa do contexto:", companyData);
  console.log("🏢 CompanyHeader - Dados do localStorage:", profileData);
  console.log("🏢 CompanyHeader - Dados finais para exibição:", displayData);

  return (
    <div className="preview-company-header border border-gray-300 mb-8 p-10 bg-white shadow-lg rounded-lg">
      <div className="flex items-start justify-between gap-8">
        {/* Logo do lado esquerdo - melhorado */}
        <div className="flex-shrink-0">
          {displayData.logo ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
              <img 
                src={displayData.logo} 
                alt="Logo da empresa" 
                className="max-h-20 max-w-40 object-contain"
              />
            </div>
          ) : (
            <div className="w-40 h-20 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium shadow-sm">
              Logo da Empresa
            </div>
          )}
        </div>

        {/* Dados da empresa do lado direito - hierarquia melhorada */}
        <div className="text-right flex-1 space-y-3">
          {/* Nome da empresa - destaque principal */}
          <div className="font-bold text-2xl text-gray-900 leading-tight tracking-tight">
            {displayData.name}
          </div>
          
          {/* CNPJ */}
          {displayData.cnpj && displayData.cnpj !== "CNPJ não informado" && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-gray-500 text-sm font-medium">CNPJ:</span>
              <span className="text-sm font-medium">{displayData.cnpj}</span>
            </div>
          )}
          
          {/* Informações de contato - organizadas com melhor hierarquia */}
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center justify-end gap-2">
              <span className="text-gray-500 text-sm font-medium">Endereço:</span>
              <span className="text-sm">{displayData.address}</span>
            </div>
            
            {/* Cidade e Estado */}
            {(displayData.city !== "Cidade não informada" || displayData.state !== "Estado não informado") && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-gray-500 text-sm font-medium">Cidade/Estado:</span>
                <span className="text-sm">{displayData.city}/{displayData.state}</span>
              </div>
            )}
            
            <div className="flex items-center justify-end gap-2">
              <span className="text-gray-500 text-sm font-medium">Telefone:</span>
              <span className="text-sm font-medium">{displayData.phone}</span>
            </div>
            
            {/* Responsável */}
            {displayData.responsibleName && displayData.responsibleName !== "Responsável não informado" && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-gray-500 text-sm font-medium">Responsável:</span>
                <span className="text-sm font-medium">{displayData.responsibleName}</span>
              </div>
            )}
            
            {/* Informações digitais com destaque */}
            <div className="pt-2 border-t border-gray-200 space-y-1">
              {displayData.website && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gray-500 text-sm font-medium">Website:</span>
                  <a 
                    href={`http://${displayData.website}`} 
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {displayData.website}
                  </a>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-2">
                <span className="text-gray-500 text-sm font-medium">E-mail:</span>
                <a 
                  href={`mailto:${displayData.email}`} 
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors hover:underline"
                >
                  {displayData.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyHeader;
