import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "¿Cómo funciona la activación de cuentas?",
    answer:
      "El administrador define un monto de activación para cada cuenta. Una vez que se deposita dicho monto, la cuenta se activa automáticamente y el usuario puede comenzar a operar.",
  },
  {
    question: "¿Cuánto tiempo tarda en acreditarse un depósito?",
    answer:
      "Los depósitos se acreditan de forma instantánea una vez verificados. Generalmente el proceso toma entre 5-15 minutos dependiendo del método de pago.",
  },
  {
    question: "¿Qué métodos de pago son compatibles?",
    answer:
      "Aceptamos transferencias bancarias, pagos con tarjeta y otros métodos de pago electrónicos. Estamos constantemente agregando nuevas opciones.",
  },
  {
    question: "¿Cómo funciona el control de acceso por roles?",
    answer:
      "Existen tres roles principales: Administrador (control total), Empresa (gestión de cuentas internas) y Usuario (operaciones básicas). Cada rol tiene permisos específicos configurables.",
  },
  {
    question: "¿Qué soporte ofrecen?",
    answer:
      "Ofrecemos soporte por email para todos los planes, y soporte prioritario 24/7 para planes Pro y Corporativo. Los planes Corporativos incluyen un gerente de cuenta dedicado.",
  },
];

const contactInfo = [
  { icon: Mail, label: "Notificaciones", value: "alerts@quantumledgerbusiness.pro" },
  { icon: MapPin, label: "Oficina", value: "Miami, FL, Estados Unidos" },
];

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Nos pondremos en contacto contigo pronto.",
    });
    setFormData({ name: "", email: "", company: "", message: "" });
  };

  return (
    <section id="contacto" className="py-24 bg-background">
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
            Contacto
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            ¿Tienes preguntas? Estamos aquí para ayudarte
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nuestro equipo está listo para resolver tus dudas y ayudarte a
            comenzar
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Envíanos un mensaje
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nombre
                    </label>
                    <Input
                      type="text"
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Empresa (opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Nombre de tu empresa"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <Textarea
                    placeholder="¿En qué podemos ayudarte?"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={4}
                    className="bg-background resize-none"
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Enviar mensaje
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>

              {/* Contact Info */}
              <div className="mt-8 pt-8 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-4">Información de contacto</h4>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {info.label}
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {info.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Preguntas frecuentes
            </h3>

            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-accent/30"
                >
                  <AccordionTrigger className="text-left text-foreground hover:text-accent hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
