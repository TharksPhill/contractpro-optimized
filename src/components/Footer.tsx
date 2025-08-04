
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-800 py-4 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-sm">
            &copy; {new Date().getFullYear()} Sistema Profissional de Gestão de Contratos - Todos os direitos reservados
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link 
              to="/privacy-policy" 
              className="text-gray-600 hover:text-gray-800 hover:underline transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              to="/terms-of-service" 
              className="text-gray-600 hover:text-gray-800 hover:underline transition-colors"
            >
              Termos de Utilização
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
