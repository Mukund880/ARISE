export class AssessmentService {
  static async evaluateAnswer(moduleId: string, selectedOption: number, correctOption: number) {
    // In the future this will track performance, adjust adaptive difficulty, and save to DB
    const isCorrect = selectedOption === correctOption;
    return {
      isCorrect,
      performanceScore: isCorrect ? 1.0 : 0.0,
      requiresReview: !isCorrect
    };
  }
}
