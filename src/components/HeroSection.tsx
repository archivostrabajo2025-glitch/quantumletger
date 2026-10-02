import { useNavigate, createSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const floatingIcons = [
  { Icon: Shield, delay: 0, x: "10%", y: "20%" },
  { Icon: Users, delay: 0.2, x: "85%", y: "30%" },
  { Icon: CreditCard, delay: 0.4, x: "15%", y: "70%" },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden pt-20"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        {/* Floating Icons */}
        {floatingIcons.map(({ Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5, duration: 0.5 }}
            className="absolute hidden lg:block"
            style={{ left: x, top: y }}
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay }}
              className="w-14 h-14 rounded-2xl bg-card shadow-lg border border-border flex items-center justify-center"
            >
              <Icon className="w-7 h-7 text-accent" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-accent">
              Plataforma de gestión financiera empresarial
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
          >
            Gestión centralizada de{" "}
            <span className="text-gradient-accent">pagos y finanzas</span> para
            empresas
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Controle los saldos, activaciones y pagos de cada cuenta desde un
            solo panel. Seguridad de nivel bancario para su empresa.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20"
          >
            <Button 
              size="xl" 
              variant="accent" 
              className="group cursor-pointer"
              onClick={() => {
                navigate({
                  pathname: "/auth",
                  search: createSearchParams({ tab: "signup" }).toString()
                });
              }}
              type="button"
            >
              Crear cuenta
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="xl" 
              variant="hero"
              className="cursor-pointer"
              onClick={() => {
                navigate({
                  pathname: "/auth",
                  search: createSearchParams({ tab: "login" }).toString()
                });
              }}
              type="button"
            >
              Iniciar sesión
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-border"
          >
            {[
              { value: "$2.5B+", label: "Volumen procesado" },
              { value: "15K+", label: "Empresas activas" },
              { value: "99.9%", label: "Uptime garantizado" },
              { value: "24/7", label: "Soporte dedicado" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
