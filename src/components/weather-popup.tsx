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
import CarouselContainer from "./carousel-container";

type WeatherPopupProps = {
  selected: { position: [number, number]; name: string } | undefined;
  onClose: () => void;
};

export const WeatherPopup: React.FC<WeatherPopupProps> = ({
  selected,
  onClose,
}) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 1),
    to: new Date(2025, 5, 11),
  });

  if (!selected) return null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selected.name}</DialogTitle>
          <DialogDescription>
            经度：{selected.position[0].toFixed(2)} 纬度：
            {selected.position[1].toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 w-full overflow-hidden items-center py-1">
          <DatePicker value={date} onChange={setDate} />
          {date && (
            <CarouselContainer
              className="h-[400px]"
              items={[
                {
                  component: (
                    <WeatherChart
                      type="temperature"
                      position={selected.position}
                      date={date}
                    />
                  ),
                  title: "温度",
                },
                {
                  component: (
                    <WeatherChart
                      type="wind_speed"
                      position={selected.position}
                      date={date}
                    />
                  ),
                  title: "风速",
                },
                {
                  component: (
                    <WeatherChart
                      type="precipitation"
                      position={selected.position}
                      date={date}
                    />
                  ),
                  title: "6h累计降水量",
                },
              ]}
            ></CarouselContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
