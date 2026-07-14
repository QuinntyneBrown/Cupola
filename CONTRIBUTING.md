# Contributing to Cupola

Thank you for contributing to Cupola.

## Before you start

1. Search existing issues and pull requests before opening a new one.
2. For major changes, open an issue first so maintainers can align on scope.
3. Keep changes focused and traceable to a clear problem statement.

## Development setup

1. Clone the repository:

   ```bash
   git clone https://github.com/QuinntyneBrown/Cupola.git
   cd Cupola
   ```

2. Start backend:

   ```bash
   cd backend
   dotnet restore
   dotnet run --project src/Cupola.Api/Cupola.Api.csproj
   ```

3. Start frontend in a second terminal:

   ```bash
   cd frontend
   npm ci
   npm run start
   ```

## Testing expectations

Run tests that cover your changes before opening a pull request:

```bash
dotnet test backend/Cupola.sln
cd frontend
npm run test
npm run e2e
```

## Pull request guidelines

1. Create a descriptive branch name.
2. Write clear commit messages in imperative mood.
3. Include a short summary of what changed and why.
4. Link the related issue when applicable.
5. Add screenshots or recordings for UI changes.
6. Keep pull requests reviewable and scoped.

## Code style

- Follow existing repository patterns and naming conventions.
- Prefer small, cohesive functions and explicit types.
- Avoid unrelated refactors in feature or bug-fix pull requests.

## Documentation

Update documentation when behavior, setup, interfaces, or workflows change.

## Code of conduct

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
