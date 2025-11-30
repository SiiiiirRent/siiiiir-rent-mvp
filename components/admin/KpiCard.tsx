interface KpiCardProps {
  title: string;
  value: number | string;
  icon: string;
  color?: "green" | "blue" | "yellow" | "red" | "gray" | "purple";
}

export default function KpiCard({
  title,
  value,
  icon,
  color = "green",
}: KpiCardProps) {
  const colorClasses = {
    green: "bg-green-50 border-green-200 text-green-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    purple: "bg-purple-100 text-purple-700",
  };

  const iconBgClasses = {
    green: "bg-green-100",
    blue: "bg-blue-100",
    yellow: "bg-yellow-100",
    red: "bg-red-100",
    gray: "bg-gray-100",
    purple: "gb-purple-100",
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
