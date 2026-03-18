package wissen.daemonops.sharemarket.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import wissen.daemonops.sharemarket.dtos.CompanyRequest;
import wissen.daemonops.sharemarket.dtos.CompanyResponse;
import wissen.daemonops.sharemarket.exceptions.CompanyNotFoundException;
import wissen.daemonops.sharemarket.exceptions.DuplicateTickerException;
import wissen.daemonops.sharemarket.exceptions.UnauthorizedException;
import wissen.daemonops.sharemarket.services.CompanyService;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CompanyControllerTest {

    @Mock
    private CompanyService companyService;

    @InjectMocks
    private CompanyController companyController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(companyController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testAddCompany() throws Exception {
        CompanyRequest request = new CompanyRequest();
        CompanyResponse response = new CompanyResponse();

        when(companyService.addCompany(any(), any())).thenReturn(response);

        mockMvc.perform(post("/companies")
                .header("X-User-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void testUpdateCompany() throws Exception {
        CompanyRequest request = new CompanyRequest();
        CompanyResponse response = new CompanyResponse();

        when(companyService.updateCompany(eq(1L), any(), any())).thenReturn(response);

        mockMvc.perform(put("/companies/1")
                .header("X-User-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testRemoveCompany() throws Exception {
        doNothing().when(companyService).removeCompany(1L, "ADMIN");

        mockMvc.perform(delete("/companies/1")
                .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(content().string("Company removed successfully"));
    }

    @Test
    void testGetAllCompanies() throws Exception {
        when(companyService.getAllCompanies())
                .thenReturn(List.of(new CompanyResponse()));

        mockMvc.perform(get("/companies"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetCompanyById() throws Exception {
        when(companyService.getCompanyById(1L))
                .thenReturn(new CompanyResponse());

        mockMvc.perform(get("/companies/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetBySector() throws Exception {
        when(companyService.getCompaniesBySector("IT"))
                .thenReturn(List.of(new CompanyResponse()));

        mockMvc.perform(get("/companies/sector/IT"))
                .andExpect(status().isOk());
    }
}