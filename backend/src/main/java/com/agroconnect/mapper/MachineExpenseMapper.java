package com.agroconnect.mapper;

import com.agroconnect.dto.response.MachineExpenseResponse;
import com.agroconnect.model.MachineExpense;

public final class MachineExpenseMapper {

    private MachineExpenseMapper() {}

    public static MachineExpenseResponse toResponse(MachineExpense expense, String createdByName) {
        return new MachineExpenseResponse(
                expense.getId(),
                expense.getMachine().getId(),
                expense.getCategory(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getIncurredAt(),
                expense.getNotes(),
                expense.getCreatedBy().getId(),
                createdByName,
                expense.getCreatedAt()
        );
    }
}
