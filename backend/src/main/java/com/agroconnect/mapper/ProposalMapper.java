package com.agroconnect.mapper;

import com.agroconnect.dto.response.ProposalResponse;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;

public final class ProposalMapper {

    private ProposalMapper() {}

    public static ProposalResponse toResponse(Proposal proposal) {
        ProviderProfile provider = proposal.getProvider();
        return new ProposalResponse(
                proposal.getId(),
                proposal.getRequest().getId(),
                provider.getId(),
                provider.getCompanyName(),
                provider.getAvgRating(),
                provider.getTotalReviews(),
                proposal.getStatus(),
                proposal.getPrice(),
                proposal.getPricingModel(),
                proposal.getUnitPrice(),
                proposal.getEstimatedUnits(),
                proposal.getDescription(),
                proposal.getIncludesText(),
                proposal.getExcludesText(),
                proposal.getEstimatedDate(),
                proposal.getValidUntil(),
                proposal.getCreatedAt()
        );
    }
}
