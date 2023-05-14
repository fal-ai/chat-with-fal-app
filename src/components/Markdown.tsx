import { Remark } from "react-remark";
import gfm from "remark-gfm";

type MarkdownProps = {
  children: string;
};

export default function Markdown({ children }: MarkdownProps) {
  return <Remark remarkPlugins={[gfm as any]}>{children}</Remark>;
}
