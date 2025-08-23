import { Link } from "react-router-dom";

export const TopMenu = () => {
  return (
    <nav className="flex gap-6 items-center p-4 border-b">
      <Link to="/" className="hover:text-primary transition-colors">
        Home
      </Link>
      <Link to="/documents" className="hover:text-primary transition-colors">
        Documents
      </Link>
      <Link to="/search" className="hover:text-primary transition-colors">
        Search
      </Link>
      <Link to="/platform" className="hover:text-primary transition-colors">
        Platform
      </Link>
      <Link to="/about" className="hover:text-primary transition-colors">
        About
      </Link>
      <Link to="/contact" className="hover:text-primary transition-colors">
        Contact
      </Link>
    </nav>
  );
};