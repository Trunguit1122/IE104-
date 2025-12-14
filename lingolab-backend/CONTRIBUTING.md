# Contributing to LingoLab Backend

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Start database: `docker-compose up postgres -d`
5. Run migrations: `npm run migration:run`
6. Seed database: `npm run seed`
7. Start dev server: `npm run dev`

## Code Style

- Use TypeScript strict mode
- Follow existing code structure (controllers → services → entities)
- Add TSOA decorators to all API endpoints
- Write meaningful commit messages

## Submitting Changes

1. Create a feature branch
2. Make your changes
3. Run `npm run swagger` to regenerate docs
4. Test your changes
5. Submit a pull request

## Testing

- Test all endpoints via Swagger UI
- Ensure database migrations run successfully
- Verify no TypeScript errors: `npm run build`

Thank you for contributing! 🎉
