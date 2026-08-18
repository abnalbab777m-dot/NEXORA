import re
content = open("server.ts").read()
content = content.replace("import routes from './server/routes';", "import routes from './server/routes';\nimport { testRouter } from './server/routes/test';")
content = content.replace("app.use('/api', routes);", "app.use('/api', routes);\n  app.use('/api', testRouter);")
open("server.ts", "w").write(content)
