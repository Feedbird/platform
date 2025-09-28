import { ServicePlan } from "@/lib/supabase/client";
import React from "react";

type Props = {
  plans: ServicePlan[];
};

export default function PlanSelection({ plans }: Props) {
  return <div>PlanSelection</div>;
}
