
import { KnowledgeBase, DiagnosticResult, UncertaintyReport, Symptom } from '../types';

export class FOLDiagnosticEngine {
  private kb: KnowledgeBase;

  constructor(kb: KnowledgeBase) {
    this.kb = kb;
  }

  /**
   * Forward Chaining: Start with known symptoms and find all possible conclusions.
   */
  public forwardChain(selectedSymptomIds: string[]): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    for (const rule of this.kb.rules) {
      const disease = this.kb.diseases.find(d => d.id === rule.conclusion)!;
      const trace: string[] = [];
      const conflicting: string[] = [];
      const missingRequired: string[] = [];
      
      // Check Exclusions (FOL: Symptom -> NOT Disease)
      const foundExclusions = rule.exclusions?.filter(id => selectedSymptomIds.includes(id)) || [];
      if (foundExclusions.length > 0) {
        foundExclusions.forEach(id => {
          const s = this.kb.symptoms.find(sym => sym.id === id);
          conflicting.push(s?.name || id);
        });
        trace.push(`Rule ${rule.id} invalidated by exclusion: ${conflicting.join(', ')}`);
      }

      // Check Requirements (FOL: S1 AND S2 AND ... -> Disease)
      let matchCount = 0;
      rule.requirements.forEach(reqId => {
        if (selectedSymptomIds.includes(reqId)) {
          matchCount++;
        } else {
          const s = this.kb.symptoms.find(sym => sym.id === reqId);
          missingRequired.push(s?.name || reqId);
        }
      });

      // Calculate confidence based on requirements and optional symptoms
      const totalRequired = rule.requirements.length;
      const optionalMatches = rule.optional?.filter(id => selectedSymptomIds.includes(id)).length || 0;
      const totalPotential = totalRequired + (rule.optional?.length || 0);
      
      // Penalty for missing requirements, bonus for optional
      let confidence = (matchCount / totalRequired) * 0.8;
      if (totalRequired === matchCount) {
        confidence = 0.8 + (optionalMatches / (rule.optional?.length || 1)) * 0.2;
      }
      
      // Wipe confidence if exclusion exists
      if (conflicting.length > 0) confidence *= 0.1;

      trace.push(`Checking requirements for ${disease.name}: ${matchCount}/${totalRequired} found.`);
      if (missingRequired.length > 0) {
        trace.push(`Missing: ${missingRequired.join(', ')}`);
      }
      if (optionalMatches > 0) {
        trace.push(`Bonus matches (optional): ${optionalMatches}`);
      }

      results.push({
        diseaseId: disease.id,
        diseaseName: disease.name,
        confidence: Math.round(confidence * 100),
        matchCount,
        missingCount: missingRequired.length,
        satisfied: matchCount === totalRequired && conflicting.length === 0,
        conflicting,
        missingRequired,
        trace,
        reason: rule.description
      });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Backward Chaining: Start with a target disease (goal) and verify its preconditions.
   */
  public backwardChain(goalDiseaseId: string, selectedSymptomIds: string[]): DiagnosticResult | null {
    const rule = this.kb.rules.find(r => r.conclusion === goalDiseaseId);
    if (!rule) return null;

    // In a true FOL backward chain, we would recursively resolve sub-goals.
    // Here we verify the rule's specific requirements against the fact base.
    const result = this.forwardChain(selectedSymptomIds).find(r => r.diseaseId === goalDiseaseId);
    return result || null;
  }

  /**
   * Identifies uncertainty cases: Ambiguity, Conflict, Noise, Incomplete data.
   */
  public analyzeUncertainty(results: DiagnosticResult[], selectedSymptomIds: string[]): UncertaintyReport {
    // Noise: Symptoms selected that don't appear in any rule
    const allRelevantSymptomIds = new Set<string>();
    this.kb.rules.forEach(r => {
      r.requirements.forEach(id => allRelevantSymptomIds.add(id));
      r.optional?.forEach(id => allRelevantSymptomIds.add(id));
    });
    const noise = selectedSymptomIds
      .filter(id => !allRelevantSymptomIds.has(id))
      .map(id => this.kb.symptoms.find(s => s.id === id)?.name || id);

    // Conflicting: High confidence but contains exclusions
    const conflicting = results.filter(r => r.conflicting.length > 0 && r.matchCount > 0);

    // Incomplete: Partially satisfied requirements
    const incomplete = results.filter(r => r.matchCount > 0 && r.matchCount < r.missingCount + r.matchCount && r.conflicting.length === 0);

    // Ambiguous: Top 2 results have very close confidence
    const ambiguous = results.length >= 2 && Math.abs(results[0].confidence - results[1].confidence) < 15 
      ? [results[0], results[1]] 
      : [];

    return { incomplete, conflicting, ambiguous, noise };
  }
}
