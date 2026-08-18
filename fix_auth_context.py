import re

content = open("src/context/AuthContext.tsx").read()

old_fetchUser = """  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };"""

new_fetchUser = """  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };"""
content = content.replace(old_fetchUser, new_fetchUser)
content = content.replace("refreshUser: () => Promise<void>;", "refreshUser: () => Promise<boolean | void>;")

open("src/context/AuthContext.tsx", "w").write(content)
