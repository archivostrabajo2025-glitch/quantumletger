import { motion } from "framer-motion";
import {
  Wallet,
  Building2,
  CreditCard,
  Settings,
  ArrowUpRight,
} from "lucide-react";

const benefits = [
  {
    icon: Wallet,
    title: "Control total de cuentas internas",
    description:
      "Administre todas las cuentas de su empresa desde un único panel centralizado con visibilidad completa de saldos y movimientos.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Building2,
    title: "Gestión de pagos empresariales",
    description:
      "Realice pagos masivos, programe transferencias y automatice la distribución de fondos entre departamentos y empleados.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: CreditCard,
    title: "Activación de cuentas configurables",
    description:
      "Defina montos de activación personalizados para cada cuenta. Control granular sobre cuándo y cómo se activan las cuentas.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Settings,
    title: "Panel de administración avanzado",
    description:
      "Herramientas completas de administración con reportes en tiempo real, auditoría de transacciones y gestión de roles.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function BenefitsSection() {
  return (
    <section className="py-24 bg-background relative">
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
            Beneficios
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Todo lo que necesita para gestionar sus pagos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Quantum Ledger Business ofrece las herramientas más avanzadas para
            la gestión financiera empresarial
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative p-8 rounded-2xl bg-gradient-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-xl"
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl ${benefit.bgColor} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}
              >
                <benefit.icon className={`w-7 h-7 ${benefit.color}`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                {benefit.title}
                <ArrowUpRight className="w-5 h-5 text-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>

              {/* Hover Gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
