interface Env {
  DB?: D1Database;
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {

    // 从数据库获取数据
    const { results } = env.DB ? await env.DB.prepare(
      "SELECT key, value FROM config"
    ).all<{ key: string; value: string }>() : { results: [] };

    const configMap = new Map();
    results?.forEach((row) => configMap.set(row.key, row.value));

    // 验证和解析数据
    let categories = [];
    let background = null;
    let prefs = null;

    try {
      categories = JSON.parse(configMap.get("categories") || "[]");

      // 验证categories结构
      if (!Array.isArray(categories) || categories.length === 0) {
        console.warn("Invalid or empty categories format in database, using default");
        // 返回默认分类结构
        categories = [
          {
            id: "home",
            title: "Home",
            subCategories: [
              {
                id: "default",
                title: "Default",
                items: [
                  { id: "1", title: "Google", url: "https://google.com", icon: "Search" },
                  { id: "2", title: "GitHub", url: "https://github.com", icon: "Github" }
                ]
              }
            ]
          }
        ];
      }
    } catch (e) {
      console.error("Error parsing categories from database:", e);
      // 返回默认分类结构
      categories = [
        {
          id: "home",
          title: "Home",
          subCategories: [
            {
              id: "default",
              title: "Default",
              items: [
                { id: "1", title: "Google", url: "https://google.com", icon: "Search" },
                { id: "2", title: "GitHub", url: "https://github.com", icon: "Github" }
              ]
            }
          ]
        }
      ];
    }

    try {
      background = configMap.get("background") || null;

      // 验证background格式
      if (background && typeof background !== "string") {
        console.warn("Invalid background format in database, using default");
        background = null;
      }
      
      // 如果没有背景，使用默认背景
      if (!background) {
        background = "radial-gradient(circle at 50% -20%, #334155, #0f172a, #020617)";
      }
    } catch (e) {
      console.error("Error parsing background from database:", e);
      background = "radial-gradient(circle at 50% -20%, #334155, #0f172a, #020617)";
    }

    try {
      prefs = JSON.parse(configMap.get("prefs") || "null");

      // 验证prefs结构
      if (prefs && typeof prefs !== "object") {
        console.warn("Invalid prefs format in database, using default");
        prefs = null;
      }
      
      // 如果没有prefs，使用默认值
      if (!prefs) {
        prefs = {
          cardOpacity: 0.1,
          themeColor: "#6280a3",
          themeMode: "dark" // 字符串形式，将在前端被正确解析
        };
      }
    } catch (e) {
      console.error("Error parsing prefs from database:", e);
      prefs = {
        cardOpacity: 0.1,
        themeColor: "#6280a3",
        themeMode: "dark"
      };
    }

    const authCode = configMap.get("auth_code");
    const responseData = {
      categories,
      background,
      prefs,
      isDefaultCode: !authCode || authCode === "admin",
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Bootstrap API Error:", error);

    // 即使出错也返回基本结构，确保前端能正常工作
    return new Response(
      JSON.stringify({
        categories: [
          {
            id: "home",
            title: "Home",
            subCategories: [
              {
                id: "default",
                title: "Default",
                items: [
                  { id: "1", title: "Google", url: "https://google.com", icon: "Search" },
                  { id: "2", title: "GitHub", url: "https://github.com", icon: "Github" }
                ]
              }
            ]
          }
        ],
        background: "radial-gradient(circle at 50% -20%, #334155, #0f172a, #020617)",
        prefs: {
          cardOpacity: 0.1,
          themeColor: "#6280a3",
          themeMode: "dark"
        },
        isDefaultCode: true,
        error: "Failed to load configuration, using defaults",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
