export interface LegalAuthorityCitation {
  readonly lawName?: string | undefined;
  readonly articleNo?: string | undefined;
  readonly title?: string | undefined;
}

export interface CaseAuthorityCitation {
  readonly caseNumber?: string | undefined;
  readonly decisionDate?: string | undefined;
  readonly court?: string | undefined;
  readonly title?: string | undefined;
}

export interface CitationVerifierInput {
  readonly legalAuthorities?: readonly LegalAuthorityCitation[] | undefined;
  readonly caseAuthorities?: readonly CaseAuthorityCitation[] | undefined;
  readonly limitations?: readonly string[] | undefined;
}

export interface CitationVerifierResult {
  readonly legalAuthoritiesValid: boolean;
  readonly caseAuthoritiesValid: boolean;
  readonly hasLegalAuthority: boolean;
  readonly hasCaseAuthority: boolean;
  readonly sourceSufficiency: "sufficient" | "partial" | "insufficient";
  readonly limitations: readonly string[];
  readonly blocksDefinitiveAnalysis: boolean;
  readonly missingFields: {
    readonly legalAuthorities: readonly string[];
    readonly caseAuthorities: readonly string[];
  };
}

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function unique(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}

function verifyLegalAuthorities(authorities: readonly LegalAuthorityCitation[]): {
  readonly valid: boolean;
  readonly missingFields: readonly string[];
} {
  if (authorities.length === 0) {
    return { valid: false, missingFields: ["legalAuthorities"] };
  }

  const missing = authorities.flatMap((authority, index) => {
    const prefix = `legalAuthorities[${index}]`;
    const fields: string[] = [];

    if (!hasValue(authority.lawName)) {
      fields.push(`${prefix}.lawName`);
    }

    if (!hasValue(authority.articleNo)) {
      fields.push(`${prefix}.articleNo`);
    }

    return fields;
  });

  return { valid: missing.length === 0, missingFields: missing };
}

function verifyCaseAuthorities(authorities: readonly CaseAuthorityCitation[]): {
  readonly valid: boolean;
  readonly missingFields: readonly string[];
} {
  if (authorities.length === 0) {
    return { valid: false, missingFields: ["caseAuthorities"] };
  }

  const missing = authorities.flatMap((authority, index) => {
    if (hasValue(authority.caseNumber) || hasValue(authority.decisionDate)) {
      return [];
    }

    return [`caseAuthorities[${index}].caseNumber_or_decisionDate`];
  });

  return { valid: missing.length === 0, missingFields: missing };
}

function getSourceSufficiency(options: {
  readonly hasLegalAuthority: boolean;
  readonly hasCaseAuthority: boolean;
  readonly legalAuthoritiesValid: boolean;
  readonly caseAuthoritiesValid: boolean;
}): CitationVerifierResult["sourceSufficiency"] {
  if (options.legalAuthoritiesValid && options.caseAuthoritiesValid) {
    return "sufficient";
  }

  if (
    (options.hasLegalAuthority && options.legalAuthoritiesValid) ||
    (options.hasCaseAuthority && options.caseAuthoritiesValid)
  ) {
    return "partial";
  }

  return "insufficient";
}

export function verifyCitations(input: CitationVerifierInput): CitationVerifierResult {
  const legalAuthorities = input.legalAuthorities ?? [];
  const caseAuthorities = input.caseAuthorities ?? [];
  const legal = verifyLegalAuthorities(legalAuthorities);
  const cases = verifyCaseAuthorities(caseAuthorities);
  const hasLegalAuthority = legalAuthorities.length > 0;
  const hasCaseAuthority = caseAuthorities.length > 0;
  const sourceSufficiency = getSourceSufficiency({
    hasLegalAuthority,
    hasCaseAuthority,
    legalAuthoritiesValid: legal.valid,
    caseAuthoritiesValid: cases.valid,
  });
  const sourceNeedsReview = sourceSufficiency !== "sufficient";
  const noLegalOrCaseAuthority = !hasLegalAuthority && !hasCaseAuthority;

  return {
    legalAuthoritiesValid: legal.valid,
    caseAuthoritiesValid: cases.valid,
    hasLegalAuthority,
    hasCaseAuthority,
    sourceSufficiency,
    limitations: sourceNeedsReview
      ? unique([...(input.limitations ?? []), "출처 확인 필요"])
      : [...(input.limitations ?? [])],
    blocksDefinitiveAnalysis: sourceNeedsReview || noLegalOrCaseAuthority,
    missingFields: {
      legalAuthorities: legal.missingFields,
      caseAuthorities: cases.missingFields,
    },
  };
}

export const citationVerifierService = {
  verify: verifyCitations,
};
