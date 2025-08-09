import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WeatherPopupProps = {
  position: [number, number] | undefined;
  onClose: () => void;
};

export const WeatherPopup: React.FC<WeatherPopupProps> = ({
  position,
  onClose,
}) => {
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
        <div className="flex items-center gap-2"></div>
      </DialogContent>
    </Dialog>
  );
};
