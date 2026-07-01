def analyze(data):
    salary       = data.get("salary", 0)
    fixed        = data.get("fixed", 35)
    daily        = data.get("daily", 20)
    entertainment= data.get("entertainment", 10)
    savings      = data.get("savings", 25)
    charity      = data.get("charity", 5)

    # حسابات مالية بسيطة
    monthly_save   = round(salary * savings / 100)
    monthly_spend  = round(salary * (fixed + daily + entertainment) / 100)
    monthly_charity= round(salary * charity / 100)

    # نقاط الصحة المالية (من 100)
    health_score = min(100, 50 + savings + (5 if entertainment < 15 else 0) + (5 if charity >= 5 else 0))

    # تقدير الوصول لهدف 100,000 ريال
    months_to_goal = round(100000 / monthly_save) if monthly_save > 0 else 999

    # توصيات
    recommendations = []
    if savings >= 20:
        recommendations.append("✅ نسبة ادخارك ممتازة — استمر!")
    else:
        recommendations.append("⚠️ حاول رفع نسبة الادخار إلى 20% على الأقل.")
    if entertainment > 15:
        recommendations.append(f"⚠️ الترفيه مرتفع ({entertainment}%) — حاول تقليصه.")
    else:
        recommendations.append("✅ إنفاقك على الترفيه معقول.")
    if charity >= 5:
        recommendations.append("✅ أنت تؤدي الزكاة بانتظام — بارك الله فيك.")

    return {
        "success": True,
        "health_score": health_score,
        "monthly_save": monthly_save,
        "monthly_spend": monthly_spend,
        "monthly_charity": monthly_charity,
        "months_to_goal": months_to_goal,
        "recommendations": recommendations,
        "summary": f"راتبك {salary} ريال — تدّخر {monthly_save} ريال شهرياً — صحتك المالية {health_score}/100"
    }