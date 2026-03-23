type MainInputProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  fullWidth?: boolean;
  error?: string;
  readonly?: boolean;
};

export default function MainInput({
  label,
  required = false,
  placeholder = "",
  value,
  onChangeText,
  type = "text",
  fullWidth = false,
  error,
  readonly = false,
}: MainInputProps) {
    // "Company Name" → "company-name"
    const inputId = label.toLowerCase().replace(/\s+/g, "-"); 

    return (
        <div className={`main-input ${fullWidth ? "main-input--full" : ""}`}>
            <label className="main-input__label" htmlFor={inputId}>
                {label} {required && <span className="main-input__required">*</span>}
            </label>

            <input
                id={inputId}
                className={`main-input__field ${error ? "main-input__field--error" : ""}`}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChangeText(e.target.value)}
                readOnly={readonly}
            />

            {error && <span className="main-input__error">{error}</span>}
        </div>
    );
}