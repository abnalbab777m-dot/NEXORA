import re

content = open("src/pages/auth/LoginPage.tsx").read()

old_login = """    try {
      await api.login({ email, password });
      await refreshUser();
    } catch (err: any) {"""

new_login = """    try {
      await api.login({ email, password });
      const success = await refreshUser();
      if (!success) {
        throw new Error('حدث خطأ في إنشاء الجلسة، الكوكيز قد تكون محظورة في متصفحك.');
      }
      navigate('/dashboard');
    } catch (err: any) {"""

content = content.replace(old_login, new_login)
open("src/pages/auth/LoginPage.tsx", "w").write(content)
