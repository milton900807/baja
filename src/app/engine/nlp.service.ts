import { Injectable } from '@angular/core';
import nlp from 'compromise';

@Injectable()
export class NlpService {
  constructor() {}

  extractObjectFromSentence(sentence: string): string | null {
    const doc = nlp(sentence);
    const verbs = doc.verbs().out('array');
    if (verbs.length === 0) return null;

    const verbIndex = sentence.indexOf(verbs[0]);
    const afterVerb = sentence.slice(verbIndex + verbs[0].length).trim();
    const afterDoc = nlp(afterVerb);
    const nounPhrase = afterDoc.nouns().out('text');
    return nounPhrase || null;
  }
}
