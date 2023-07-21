import React, { memo } from "react";
import { Remark, RemarkProps } from "react-remark";

type MarkdownProps = {
  children: string;
};

function MarkdownContent({ children }: MarkdownProps) {
  return <Remark>{children}</Remark>;
}

const Markdown: React.FC<RemarkProps> = memo(
  MarkdownContent,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

export default Markdown;
