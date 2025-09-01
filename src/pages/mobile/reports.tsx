import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useReports } from "@/hooks/use-reports";
import { 
  FileText, 
  Download, 
  Clock,
  ArrowLeft,
  RefreshCw
} from "lucide-react";

export const MobileReports = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    reports, 
    loading, 
    loadReports, 
    downloadReport, 
    formatFileSize, 
    formatDate 
  } = useReports();

  const handleBack = () => {
    navigate('/mobile');
  };

  const handleDownload = (fileName: string) => {
    downloadReport(fileName);
  };

  const handleRefresh = () => {
    loadReports();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wine-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medium-gray">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userType="implantador" 
        userName={user?.nome || "Implantador"}
        onLogout={signOut}
        showBackButton={true}
        backPath="/mobile"
      />
      
      <main className="p-4 space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-dark-gray">
              Meus Relatórios
            </h1>
            <p className="text-medium-gray">
              {reports.length} relatório{reports.length !== 1 ? 's' : ''} disponível{reports.length !== 1 ? 'is' : ''}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="p-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-wine-red/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-wine-red" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-dark-gray">
                        {report.name.replace('.html', '')}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          HTML
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-medium-gray mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Gerado em {formatDate(report.created_at)}</span>
                </div>

                <Button 
                  className="w-full bg-wine-red hover:bg-wine-red-hover gap-2"
                  size="lg"
                  onClick={() => handleDownload(report.name)}
                >
                  <Download className="h-4 w-4" />
                  Baixar Relatório
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-light-gray rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-medium-gray" />
            </div>
            <h3 className="text-lg font-semibold text-dark-gray mb-2">
              Nenhum relatório disponível
            </h3>
            <p className="text-medium-gray">
              Os relatórios gerados aparecerão aqui quando estiverem prontos
            </p>
          </div>
        )}
      </main>
    </div>
  );
};