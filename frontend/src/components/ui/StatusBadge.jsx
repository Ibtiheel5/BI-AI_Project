// src/components/ui/StatusBadge.jsx
import React from "react";
import { Badge } from "./Badge";
import { Icon } from "./Icon";
import { STATUS_MAP } from "../../constants/theme";

export const StatusBadge = ({ status }) => {
  const config = STATUS_MAP[status] || STATUS_MAP.pending;
  const variant =
    status === "analyzed"
      ? "success"
      : status === "accepted"
      ? "info"
      : status === "pending"
      ? "warning"
      : status === "rejected"
      ? "danger"
      : "default";

  return (
    <Badge variant={variant}>
      <Icon name={config.icon} size={14} color={config.color} />
      {config.label}
    </Badge>
  );
};

export default StatusBadge;