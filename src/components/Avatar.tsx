import { UserType } from "@/data/storage";

export interface AvatarProps {
  user: UserType;
  className: string | null;
}

export default function Avatar(props: AvatarProps) {
  const color = props.user === "bot" ? "bg-secondary" : "bg-primary";
  const className = props.className ?? "";
  return (
    <div className={`avatar placeholder ${className}`}>
      <div className={`${color} rounded-full w-10`}>
        <span className="text-white opacity-80 text-sm font-semibold">
          {props.user === "bot" ? "BOT" : "ME"}
        </span>
      </div>
    </div>
  );
}
