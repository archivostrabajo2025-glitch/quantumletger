import { Twitter, Linkedin, Github } from "lucide-react";
import logo from "@/assets/logo.png";

const footerLinks = {
  Producto: [
    { label: "Características", href: "#caracteristicas" },
    { label: "Seguridad", href: "#seguridad" },
    { label: "Planes", href: "#planes" },
    { label: "API", href: "#" },
  ],
  Empresa: [
    { label: "Sobre nosotros", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carreras", href: "#" },
    { label: "Prensa", href: "#" },
  ],
  Soporte: [
    { label: "Centro de ayuda", href: "#" },
    { label: "Contacto", href: "#contacto" },
    { label: "Documentación", href: "#" },
    { label: "Estado del sistema", href: "#" },
  ],
  Legal: [
    { label: "Términos de servicio", href: "#" },
    { label: "Política de privacidad", href: "#" },
    { label: "Cookies", href: "#" },
    { label: "Licencias", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#inicio" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Quantum Ledger Business" className="h-10 w-auto" />
            </a>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              La plataforma líder en gestión de pagos y finanzas empresariales.
              Seguridad, control y eficiencia en un solo lugar.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors duration-200"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-accent transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Quantum Ledger Business. Todos los
              derechos reservados.
            </p>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md border border-primary/20">
              <span className="text-xs font-semibold text-primary">Member FDIC</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Términos
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Privacidad
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
