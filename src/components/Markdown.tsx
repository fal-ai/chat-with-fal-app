import { Remark } from "react-remark";

type MarkdownProps = {
  children: string;
};

export default function Markdown({ children }: MarkdownProps) {
  return <Remark>{children}</Remark>;
}
