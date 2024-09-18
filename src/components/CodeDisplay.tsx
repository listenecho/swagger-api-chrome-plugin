import React from "react";
import { Highlight, themes } from "prism-react-renderer"

const CodeDisplay: React.FC<{
    code: string;
    language: string;
}> = ({ code, language }) => {
    return <Highlight
        code={code}
        theme={themes.oneDark}
        language={language}
    >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{
                ...style,
                fontSize: 14,
                paddingTop: 20,
                paddingLeft: 20,
            }} className={className}>
                {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                        ))}
                    </div>
                ))}
            </pre>
        )}
    </Highlight>
};

export default CodeDisplay