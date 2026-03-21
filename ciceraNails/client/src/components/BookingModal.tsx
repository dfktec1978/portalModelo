import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    service: "Esmaltação em Gel",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    notes: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const createAppointment = trpc.appointments.create.useMutation();
  const getAvailableSlots = trpc.appointments.getAvailableSlots.useQuery(
    selectedDate ? { date: selectedDate } : { date: new Date() },
    { enabled: !!selectedDate }
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setFormData({ ...formData, date: e.target.value });
    setSelectedDate(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const [hours, minutes] = formData.time.split(":").map(Number);
    const appointmentDate = new Date(formData.date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      await createAppointment.mutateAsync({
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        service: formData.service,
        appointmentDate,
        notes: formData.notes || undefined,
      });

      toast.success("Agendamento realizado com sucesso! Você receberá uma confirmação por email.");
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        service: "Esmaltação em Gel",
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        notes: "",
      });
      onClose();
    } catch (error) {
      toast.error("Erro ao agendar. Por favor, tente novamente.");
      console.error(error);
    }
  };

  const services = [
    "Esmaltação em Gel",
    "Blindagem",
    "Manicure Russa",
    "Pedicure",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-playfair text-marrom-cafe">
            Agende seu Horário
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para agendar seu serviço
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-marrom-cafe font-semibold">
              Nome Completo *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="border-nude-rose focus:border-marrom-cafe"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-marrom-cafe font-semibold">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="border-nude-rose focus:border-marrom-cafe"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-marrom-cafe font-semibold">
              WhatsApp *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(49) 99955-6220"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              className="border-nude-rose focus:border-marrom-cafe"
            />
          </div>

          <div>
            <Label htmlFor="service" className="text-marrom-cafe font-semibold">
              Serviço *
            </Label>
            <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
              <SelectTrigger className="border-nude-rose focus:border-marrom-cafe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date" className="text-marrom-cafe font-semibold">
              Data *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={handleDateChange}
              min={new Date().toISOString().split("T")[0]}
              className="border-nude-rose focus:border-marrom-cafe"
            />
          </div>

          <div>
            <Label htmlFor="time" className="text-marrom-cafe font-semibold">
              Horário *
            </Label>
            {getAvailableSlots.isLoading ? (
              <div className="p-2 text-center text-sm text-gray-500">Carregando horários...</div>
            ) : getAvailableSlots.data && getAvailableSlots.data.length > 0 ? (
              <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                <SelectTrigger className="border-nude-rose focus:border-marrom-cafe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSlots.data.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 text-center text-sm text-red-500">
                Nenhum horário disponível para esta data
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes" className="text-marrom-cafe font-semibold">
              Observações (opcional)
            </Label>
            <Input
              id="notes"
              type="text"
              placeholder="Alguma preferência especial?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="border-nude-rose focus:border-marrom-cafe"
            />
          </div>

          <Button
            type="submit"
            disabled={createAppointment.isPending || !getAvailableSlots.data || getAvailableSlots.data.length === 0}
            className="w-full bg-nude-rose hover:bg-marrom-cafe text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {createAppointment.isPending ? "Agendando..." : "Confirmar Agendamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
