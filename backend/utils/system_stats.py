"""
System Statistics Module for Kuat Systems Dashboard
Retrieves Raspberry Pi system metrics (CPU, RAM, Disk, Temperature)
"""

import psutil
import os


def get_cpu_temperature():
    """Get CPU temperature for Raspberry Pi"""
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = float(f.read()) / 1000.0
            return round(temp, 1)
    except FileNotFoundError:
        # Fallback for non-Pi systems (development)
        return 42.0


def get_system_stats():
    """
    Retrieve all system statistics
    Returns themed data for the Imperial Dashboard
    """
    # CPU Usage
    cpu_percent = psutil.cpu_percent(interval=1)

    # Memory Usage
    memory = psutil.virtual_memory()
    ram_percent = memory.percent
    ram_used_gb = round(memory.used / (1024**3), 2)
    ram_total_gb = round(memory.total / (1024**3), 2)

    # Disk Usage
    disk = psutil.disk_usage('/')
    disk_percent = disk.percent
    disk_used_gb = round(disk.used / (1024**3), 2)
    disk_total_gb = round(disk.total / (1024**3), 2)

    # CPU Temperature (Reactor Core)
    temp_c = get_cpu_temperature()

    # Calculate "stability" levels (inverse of usage for dramatic effect)
    reactor_stability = 100 - cpu_percent
    memory_integrity = 100 - ram_percent
    storage_capacity = 100 - disk_percent

    return {
        "reactor_core": {
            "temperature": temp_c,
            "stability": round(reactor_stability, 1),
            "status": get_status_level(reactor_stability),
            "alert": temp_c > 70  # Alert if temp exceeds 70°C
        },
        "memory_banks": {
            "integrity": round(memory_integrity, 1),
            "used_gb": ram_used_gb,
            "total_gb": ram_total_gb,
            "percent": ram_percent,
            "status": get_status_level(memory_integrity)
        },
        "storage_systems": {
            "capacity": round(storage_capacity, 1),
            "used_gb": disk_used_gb,
            "total_gb": disk_total_gb,
            "percent": disk_percent,
            "status": get_status_level(storage_capacity)
        },
        "cpu_usage": cpu_percent
    }


def get_status_level(value):
    """Convert numeric value to Imperial status level"""
    if value >= 70:
        return "OPTIMAL"
    elif value >= 40:
        return "NOMINAL"
    elif value >= 20:
        return "DEGRADED"
    else:
        return "CRITICAL"
