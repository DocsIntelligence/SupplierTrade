import { Module } from '@nestjs/common';
import { ExprEvaluator } from './expr.evaluator';

@Module({
  providers: [ExprEvaluator],
  exports: [ExprEvaluator],
})
export class ExpressionModule {}
