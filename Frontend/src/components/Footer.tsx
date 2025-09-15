import { BookOpen, Mail, Phone, MapPin, Facebook, Send, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-accent" />
              <span className="text-2xl font-bold">Mathematico</span>
            </div>
            <p className="text-primary-foreground/80">
              Empowering students worldwide with premium educational content and 
              secure learning experiences.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-accent" asChild>
                <a href="https://www.facebook.com/dipanjan1729/" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-accent" asChild>
                <a href="https://t.me/dipanjan9271" target="_blank" rel="noopener noreferrer">
                  <Send className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-accent" asChild>
                <a href="https://www.instagram.com/dipanjan_chattopadhyay?igsh=YjczenMyMHh3angx" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-accent" asChild>
                <a href="https://whatsapp.com/channel/0029Vb6l1FfDZ4LS79UMoD0V" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/books" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Browse Books
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/help-center" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80">dipanjan9271@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80">+91 9051089683</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80">Flat no-A (Ground Floor), Sunity Apartment, Noapara Arabindapally, Vidyasagar Road, PO and PS-Barasat, District 24PGS(N), Kol-700124</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-primary-foreground/80 text-sm">
              Subscribe to get the latest books and exclusive offers.
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="Enter your email" 
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <Button variant="gradient" className="w-full">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-primary-foreground/80 text-sm">
            © 2025 Mathematico. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm text-primary-foreground/80 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-accent transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};