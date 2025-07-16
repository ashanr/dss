def snapshot_kpis():
    calc  = AnalyticsCalculator()
    today = datetime.utcnow().date()
    kpis = [
        ('overall_success', calc.calculate_success_rate()['success_rate']),
        ('visa_approval',   calc.get_visa_success_rate()['visa_success_rate']),
        ('consult_satis',   calc.get_consultation_metrics()['avg_satisfaction'])
    ]
    for name, value in kpis:
        metric = PerformanceMetric(metric_name=name,
                                   metric_value=value,
                                   metric_date=today,
                                   calculation_method='auto')
        db.session.add(metric)
    db.session.commit()

sched = BackgroundScheduler(daemon=True)
sched.add_job(snapshot_kpis, 'cron', hour=0, minute=5)
sched.start()
