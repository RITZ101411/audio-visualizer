type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    variant: keyof typeof buttonStyle;
};

const buttonStyle = {
    "default": "bg-default hover:bg-default-strong",
    "green": "bg-green hover:bg-green-strong",
    "red": "bg-red hover:bg-red-strong",
} as const;

export const Button = ({ children, variant, className, ...props }: Props) => {
    return (
        <button
            className={`select-none cursor-pointer rounded-full text-white border box-border border-transparent focus:outline-none px-4 py-2.5 font-bold text-sm ${buttonStyle[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
