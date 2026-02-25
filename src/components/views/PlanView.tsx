import { useState } from "react";
import { ProtoKey, PROTO_STORAGE_KEY } from "./PrototypeSwitcher";
import { PlanViewA } from "./PlanViewA";
import { PlanViewB } from "./PlanViewB";
import { PlanViewC } from "./PlanViewC";

/**
 * PlanView dispatcher — reads the active prototype from localStorage and
 * renders the appropriate unified plan view (A, B, or C).
 *
 * All three prototypes unify plan browsing + logging + progress into a single
 * screen. The PrototypeSwitcher bar (rendered inside each prototype) lets
 * users switch between the three patterns at runtime.
 */
export function PlanView(props) {
  const [prototype, setPrototype] = useState<ProtoKey>(() => {
    const saved = localStorage.getItem(PROTO_STORAGE_KEY);
    return (saved === "A" || saved === "B" || saved === "C") ? saved : "A";
  });

  const handlePrototypeChange = (p: ProtoKey) => {
    setPrototype(p);
    localStorage.setItem(PROTO_STORAGE_KEY, p);
  };

  const sharedProps = { ...props, prototype, onPrototypeChange: handlePrototypeChange };

  if (prototype === "B") return <PlanViewB {...sharedProps} />;
  if (prototype === "C") return <PlanViewC {...sharedProps} />;
  return <PlanViewA {...sharedProps} />;
}
