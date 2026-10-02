import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  PieChart,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: LayoutDashboard,
    title: "Panel de control empresarial",
    description:
      "Vista unificada de todos los saldos, cuentas activas e inactivas. Métricas en tiempo real y alertas personalizables.",
    items: ["Resumen de saldos", "Cuentas activas/inactivas", "Alertas en tiempo real"],
  },
  {
    icon: Users,
    title: "Gestión de cuentas internas",
    description:
      "Cree, edite y desactive cuentas de empleados o departamentos. Control total sobre los permisos y límites de cada cuenta.",
    items: ["Crear y editar cuentas", "Control de permisos", "Límites personalizados"],
  },
  {
    icon: PieChart,
    title: "Distribución de fondos",
    description:
      "El administrador define cuánto dinero llega a cada cuenta. Automatice pagos recurrentes y distribuciones programadas.",
    items: ["Asignación de fondos", "Pagos automatizados", "Distribución programada"],
  },
  {
    icon: FileText,
    title: "Notas de activación",
    description:
      "Cada cuenta tiene un monto de activación definido por el administrador. Historial completo de activaciones y cambios.",
    items: ["Montos configurables", "Historial de cambios", "Notas detalladas"],
  },
];

export function FeaturesSection() {
  return (
    <section id="caracteristicas" className="py-24 bg-muted/30 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold text-sm tracking-wider uppercase">
            Características
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Herramientas diseñadas para empresas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada función ha sido diseñada pensando en las necesidades reales de
            las empresas modernas
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-8 border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-xl"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-primary-glow transition-shadow duration-300">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>

                  {/* Feature Items */}
                  <ul className="space-y-2">
                    {feature.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-center gap-2 text-sm text-foreground/80"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button size="lg" variant="default" className="group">
            Explorar todas las características
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
