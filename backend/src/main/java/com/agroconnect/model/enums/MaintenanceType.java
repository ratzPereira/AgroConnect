package com.agroconnect.model.enums;

/**
 * Classification of a machine maintenance event. ROUTINE is scheduled
 * preventive work, REPAIR is unscheduled fixing, INSPECTION is a check
 * without intervention.
 */
public enum MaintenanceType {
    ROUTINE,
    REPAIR,
    INSPECTION
}
