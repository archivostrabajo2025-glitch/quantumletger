import { motion } from "framer-motion";
import { Shield, Lock, Fingerprint, UserCheck, CheckCircle } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Cifrado de datos",
    description:
      "Todos sus datos están protegidos con cifrado AES-256, el mismo estándar utilizado por instituciones bancarias.",
  },
  {
    icon: Fingerprint,
    title: "Autenticación 2FA",
    description:
      "Agregue una capa extra de seguridad con autenticación de dos factores para todas las operaciones críticas.",
  },
  {
    icon: UserCheck,
    title: "Control de acceso por roles",
    description:
      "Defina roles personalizados (Administrador, Empresa, Usuario) con permisos específicos para cada nivel.",
  },
];

const certifications = [
  "ISO 27001 Certificado",
  "SOC 2 Type II",
  "PCI DSS Compliant",
  "GDPR Compliant",
];

export function SecuritySection() {
  return (
    <section id="seguridad" className="py-24 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-semibold text-sm tracking-wider uppercase">
              Seguridad
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-6">
              Seguridad de nivel bancario para sus activos
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Protegemos sus fondos con los más altos estándares de
              seguridad del sector financiero. Su confianza es nuestra prioridad.
            </p>

            {/* Security Features */}
            <div className="space-y-6">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Certifications */}
            <div className="mt-10 pt-8 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Certificaciones y cumplimiento
              </p>
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Security Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Central Shield */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-40 h-40 rounded-full bg-gradient-primary flex items-center justify-center shadow-xl shadow-primary/20"
                >
                  <Shield className="w-20 h-20 text-primary-foreground" />
                </motion.div>
              </div>

              {/* Orbiting Elements */}
              {[0, 72, 144, 216, 288].map((rotation, index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20 + index * 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-card shadow-lg border border-border flex items-center justify-center"
                    style={{ transform: `rotate(-${rotation}deg)` }}
                  >
                    <Lock className="w-5 h-5 text-accent" />
                  </div>
                </motion.div>
              ))}

              {/* Rings */}
              <div className="absolute inset-8 rounded-full border border-border/50" />
              <div className="absolute inset-16 rounded-full border border-border/30" />
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/20 animate-spin" style={{ animationDuration: "30s" }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
