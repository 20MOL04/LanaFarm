export type GuideLink = {
  label: string;
  href: string;
};

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "tip"; title?: string; text: string }
  | { type: "warning"; title?: string; text: string }
  | { type: "links"; links: GuideLink[] };

export type GuideSection = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};
