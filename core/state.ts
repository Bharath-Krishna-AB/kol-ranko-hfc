import { Dependency } from "../schemas/dependency";
import { ValidationResult } from "../schemas/validation";
import { ThreatIntelMap } from "../schemas/threat";
import { ScoreMap, QADecision } from "../schemas/final";

export interface PipelineState {
    rawInput: string;

    parsedDependencies?: Dependency[];
    validationResults?: ValidationResult[];
    threatIntel?: ThreatIntelMap;
    scores?: ScoreMap;
    qaDecision?: QADecision;

    errors?: string[];
}
