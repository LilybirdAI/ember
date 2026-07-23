import type { Metadata } from "next";
import SRSDemoExperience from "./SRSDemoExperience";

export const metadata: Metadata = {
  title: "SRS Partnership Demo",
  description:
    "A private enterprise demonstration of Embr Intelligence orchestration, governance, and application intelligence.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SRSDemoPage() {
  return <SRSDemoExperience />;
}
