
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  feature: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
  };
  isActive: boolean;
  onClick: () => void;
  delay?: number;
}

const FeatureCard = ({ feature, isActive, onClick, delay = 0 }: FeatureCardProps) => {
  const { title, description, icon: Icon, color } = feature;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in",
        isActive 
          ? "ring-2 ring-blue-500 shadow-xl transform scale-105" 
          : "hover:shadow-lg"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <CardContent className="p-6 text-center relative overflow-hidden">
        <div className={cn(
          "rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-all duration-300",
          color,
          isActive ? "animate-pulse" : ""
        )}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
        
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
