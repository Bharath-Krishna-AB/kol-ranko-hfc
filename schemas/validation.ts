export interface ValidationResult {
    package: string;
    isValid: boolean;
    issues: string[];
    confidenceScore: number; // 0-100
}
