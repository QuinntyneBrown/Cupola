import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { ObjectApi } from '@cupola/core';

import { ConditionResult } from '../models/condition-models';
import { ConditionSetEvaluationService } from './condition-set-evaluation.service';

/**
 * Shares one running evaluation per condition set, ref-counted so evaluation
 * starts on the first subscriber and stops on the last (OMCT-C10-L2-02.01,
 * 02.02). Consumers (styled objects, condition widgets) observe the selected
 * output through {@link outputs}.
 */
@Injectable({ providedIn: 'root' })
export class ConditionResultService {
  private readonly objects = inject(ObjectApi);
  private readonly evaluation = inject(ConditionSetEvaluationService);
  private readonly shared = new Map<string, Observable<ConditionResult>>();

  /** The selected output stream for a condition set, shared across subscribers. */
  outputs(conditionSetKeyString: string): Observable<ConditionResult> {
    let stream = this.shared.get(conditionSetKeyString);
    if (!stream) {
      stream = from(this.objects.get(conditionSetKeyString)).pipe(
        switchMap((object) => this.evaluation.evaluate(object)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.shared.set(conditionSetKeyString, stream);
    }
    return stream;
  }
}
