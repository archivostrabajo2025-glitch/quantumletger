import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Básico",
    price: "$99",
    period: "/mes",
    description: "Ideal para pequeñas empresas que inician",
    features: [
      "Hasta 10 cuentas internas",
      "Reportes básicos mensuales",
      "Soporte por email",
      "Panel de control estándar",
      "Cifrado de datos",
    ],
    highlighted: false,
    buttonVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$299",
    period: "/mes",
    description: "Para empresas en crecimiento con necesidades avanzadas",
    features: [
      "Hasta 50 cuentas internas",
      "Reportes avanzados en tiempo real",
      "Soporte prioritario 24/7",
      "API de integración",
      "Automatización de pagos",
      "Roles personalizados",
    ],
    highlighted: true,
    buttonVariant: "accent" as const,
  },
  {
    name: "Corporativo",
    price: "Contactar",
    period: "",
    description: "Solución completa para grandes corporaciones",
    features: [
      "Cuentas ilimitadas",
      "Reportes personalizados",
      "Gerente de cuenta dedicado",
      "SLA garantizado 99.99%",
      "Integración enterprise",
      "Auditoría avanzada",
      "White-label disponible",
    ],
    highlighted: false,
    buttonVariant: "outline" as const,
  },
];

export function PricingSection() {
  return (
    <section id="planes" className="py-24 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold text-sm tracking-wider uppercase">
            Planes
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Precios transparentes para cada necesidad
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Elija el plan que mejor se adapte al tamaño y necesidades de su
            empresa
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-gradient-primary text-primary-foreground shadow-xl scale-105 border-0"
                  : "bg-card border border-border hover:border-accent/30 hover:shadow-lg"
              } transition-all duration-300`}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                    <Star className="w-4 h-4" />
                    Más popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    plan.highlighted ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    className={`text-4xl font-bold ${
                      plan.highlighted ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={
                      plan.highlighted
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm ${
                    plan.highlighted
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.highlighted
                          ? "bg-primary-foreground/20"
                          : "bg-accent/10"
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          plan.highlighted ? "text-primary-foreground" : "text-accent"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm ${
                        plan.highlighted
                          ? "text-primary-foreground/90"
                          : "text-foreground/80"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant={plan.highlighted ? "hero" : plan.buttonVariant}
                className={`w-full ${plan.highlighted ? "bg-card/90 text-foreground hover:bg-card" : ""}`}
              >
                {plan.price === "Contactar" ? "Contactar ventas" : "Comenzar ahora"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
