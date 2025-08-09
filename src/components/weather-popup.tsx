import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import { DatePicker } from "./date-picker";
import { WeatherChart } from "./weather-chart";

type WeatherPopupProps = {
  position: [number, number] | undefined;
  onClose: () => void;
};

export const WeatherPopup: React.FC<WeatherPopupProps> = ({
  position,
  onClose,
}) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 1),
    to: new Date(2025, 5, 11),
  });

  if (!position) return null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weather</DialogTitle>
          <DialogDescription>
            {position[0]}, {position[1]}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-2">
          <DatePicker value={date} onChange={setDate} />
          {date && (
            <div className="w-full h-[500px]">
              <WeatherChart
                type="temperature"
                position={position}
                date={date}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
